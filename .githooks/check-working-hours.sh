#!/bin/sh

# dsh-super-agent repository policy:
# commits and pushes are blocked on weekdays from 08:00 (inclusive) to
# 18:00 (exclusive), using Asia/Singapore unless explicitly configured.
set -eu

action=${1:-git operation}
timezone=${DSH_SUPER_AGENT_TIMEZONE:-Asia/Singapore}
export TZ="$timezone"

set -- $(date '+%u %H %M')
weekday=$1
hour=${2#0}
minute=${3#0}
hour=${hour:-0}
minute=${minute:-0}
now_minutes=$((hour * 60 + minute))

if [ "$weekday" -le 5 ] && [ "$now_minutes" -ge 480 ] && [ "$now_minutes" -lt 1080 ]; then
  printf '%s\n' "dsh-super-agent: $action blocked during weekday protected hours (08:00-18:00, timezone: $timezone)."
  printf '%s\n' "Retry at or after 18:00, or on a weekend."
  exit 1
fi

exit 0
