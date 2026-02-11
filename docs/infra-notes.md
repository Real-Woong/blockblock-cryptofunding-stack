# Infra Notes (Private Ops Guide)

> This document describes infrastructure setup and operational notes.
> **Do not commit secrets.** Keep real values only in local/private storage.

## AWS

- Region: `ap-northeast-2` (Seoul)
- Recommended approach:
  - Use dedicated IAM user/role for the team account
  - Rotate access keys if exposure is suspected

### Local AWS CLI
- Credentials path:
  - `~/.aws/credentials`
- Use profiles when working with multiple accounts.

## RDS (PostgreSQL)

- Endpoint (example):
  - `cryptofunding-dev.<...>.ap-northeast-2.rds.amazonaws.com`
- Port: `5432`
- SSL:
  - `sslmode=verify-full`
  - `sslrootcert=$HOME/certs/global-bundle.pem`

### psql connection example
```bash
export RDSHOST="YOUR_RDS_ENDPOINT"
psql "host=$RDSHOST port=5432 dbname=postgres user=YOUR_USER sslmode=verify-full sslrootcert=$HOME/certs/global-bundle.pem"≈
