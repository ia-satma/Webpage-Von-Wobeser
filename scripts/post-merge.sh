#!/bin/bash
set -e
npm ci
npm run db:migrate
