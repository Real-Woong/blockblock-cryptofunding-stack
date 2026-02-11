// src/middlewares/auth.js

// ✅ jsonwebtoken 라이브러리: JWT 토큰을 검증(verify)하는 데 사용
// - JWT는 "서버가 발급한 로그인 토큰" 같은 개념
import jwt from "jsonwebtoken";

// ✅ 우리 프로젝트의 HttpError 유틸
// - unauthorized()는 statusCode=401인 에러 객체(HttpError)를 만들어서 던짐
// - 여기서는 res.status(401)로 바로 응답하지 않고, next(err)로 error.middleware.js가 처리하게 함
import { unauthorized } from "../utils/httpError.js";

// ✅ 실행 환경 값
// - production이면 개발용 헤더 인증(x-wallet-address)을 막고 JWT만 받도록 할 거야
const NODE_ENV = process.env.NODE_ENV || "development";

// ✅ JWT 검증에 쓰이는 서버 비밀키
// - 토큰을 verify 할 때 서버가 발급할 때 쓴 비밀키와 동일해야 함
// - 없으면 토큰 검증이 불가능하니까 에러 처리
const JWT_SECRET = process.env.JWT_SECRET || "";

/**
 * ✅ Authorization 헤더에서 Bearer 토큰을 뽑아오는 함수
 * - Authorization: "Bearer <token>"
 * - "Bearer"는 관례적인 접두어고, <token>이 실제 JWT 문자열
 */
function getBearerToken(req) {
  // req.headers.authorization: Node/Express에서 헤더 접근
  const auth = req.headers.authorization;

  // 헤더가 없거나 문자열이 아니면 토큰이 없다고 판단
  if (!auth || typeof auth !== "string") return null;

  // "Bearer xxx.yyy.zzz" 형태를 띄니까 공백으로 분리
  const [type, token] = auth.split(" ");

  // type이 Bearer가 아니거나 token이 없으면 무효
  if (type !== "Bearer" || !token) return null;

  // 양끝 공백 제거해서 리턴
  return token.trim();
}

/**
 * ✅ 개발용 헤더에서 지갑주소를 뽑아오는 함수
 * - 개발 단계에서는 FE가 인증 토큰(JWT) 없이도 테스트가 필요할 수 있어서
 *   x-wallet-address 헤더를 임시로 허용하는 패턴
 *
 * 주의: production에서는 이걸 허용하면 헤더 위조로 권한이 뚫리니까 반드시 막아야 함
 */
function getDevWalletHeader(req) {
  // Express에서 req.header("header-name") 으로 접근 가능
  const wallet =
    req.header("x-wallet-address") ||
    req.header("x-wallet") ||
    req.header("x-user-wallet");

  // 값이 없거나 문자열이 아니면 null
  if (!wallet || typeof wallet !== "string") return null;

  // 공백 제거해서 리턴
  return wallet.trim();
}

/**
 * ✅ 최소 지갑주소 형식 검증 함수
 * - Sui 지갑주소는 보통 0x로 시작하는 hex 문자열
 * - 여기선 "최소한"의 검증만 함 (정확한 길이/체크섬까지는 안 봄)
 */
function validateWalletFormat(wallet) {
  // ^0x : 0x로 시작
  // [a-fA-F0-9]{10,} : 뒤에는 hex가 최소 10자 이상
  // $ : 문자열 끝까지
  return /^0x[a-fA-F0-9]{10,}$/.test(wallet);
}

/**
 * ✅ JWT를 검증하고 payload에서 walletAddress를 꺼내는 함수
 *
 * - jwt.verify(token, secret): 토큰이 서버가 만든 게 맞는지, 만료되었는지 등을 검증
 * - payload는 토큰에 들어있는 데이터
 * - 여기서는 payload.walletAddress를 필수로 강제함
 */
function verifyJwtAndGetWallet(token) {
  // 서버 시크릿이 없으면 검증 자체가 불가능
  if (!JWT_SECRET) {
    // unauthorized(...) 는 HttpError(401)를 만들어서 throw 할 수 있음
    throw unauthorized("JWT_SECRET is missing on server");
  }

  let payload;

  try {
    // ✅ 토큰 검증 성공 시 payload 반환
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    // ✅ 서명 불일치/만료/형식 오류 등
    throw unauthorized("Invalid or expired token");
  }

  // payload에서 지갑주소 추출
  const wallet = payload?.walletAddress;

  // payload.walletAddress가 없거나 문자열이 아니면 인증 실패
  if (!wallet || typeof wallet !== "string") {
    throw unauthorized("Invalid token payload: walletAddress missing");
  }

  // 공백 제거 + 최소 형식 검증
  const normalized = wallet.trim();
  if (!validateWalletFormat(normalized)) {
    throw unauthorized("Invalid wallet format in token");
  }

  // 최종적으로 "신뢰 가능한 viewer 지갑주소" 반환
  return normalized;
}

/**
 * ✅ 메인 auth 미들웨어
 *
 * Express 미들웨어 문법:
 * - (req, res, next) 형태
 * - next()를 호출하면 다음 미들웨어/컨트롤러로 진행
 * - next(err)를 호출하면 error.middleware.js로 넘어감
 *
 * 이 미들웨어의 목표:
 * - 인증 성공 시: req.user.walletAddress 세팅하고 next()
 * - 인증 실패 시: next(unauthorized(...)) 로 401 던짐
 */
export default function auth(req, res, next) {
  try {
    // 1) ✅ JWT 인증 (프로덕션 기본)
    const token = getBearerToken(req);
    if (token) {
      // 토큰 검증 -> walletAddress 확정
      const walletAddress = verifyJwtAndGetWallet(token);

      // ✅ 컨트롤러/서비스에서 공통으로 쓰도록 req.user에 박아둠
      // 예: const viewerWallet = req.user.walletAddress;
      req.user = { walletAddress };

      return next();
    }

    // 2) ✅ 개발용 헤더 인증 (개발 환경에서만 허용)
    // production에서는 절대 허용하면 안 됨 (헤더 위조로 권한 뚫림)
    if (NODE_ENV !== "production") {
      const devWallet = getDevWalletHeader(req);
      if (devWallet) {
        // 최소 형식 검증
        if (!validateWalletFormat(devWallet)) {
          return next(unauthorized("Invalid wallet address format (dev header)"));
        }

        // 개발 환경에서는 이걸 "viewer wallet"로 인정
        req.user = { walletAddress: devWallet };
        return next();
      }
    }

    // 3) ✅ 위 둘 다 실패하면 인증 실패
    // - 토큰도 없고
    // - (개발모드가 아니거나) dev 헤더도 없으면
    return next(
      unauthorized(
        "Unauthorized. Use Authorization: Bearer <token> (recommended). Dev allows x-wallet-address."
      )
    );
  } catch (err) {
    // verifyJwtAndGetWallet에서 throw한 HttpError(401)도 여기로 잡힘
    // next(err)로 넘기면 error.middleware.js가 statusCode에 맞춰 응답 생성
    return next(err);
  }
}