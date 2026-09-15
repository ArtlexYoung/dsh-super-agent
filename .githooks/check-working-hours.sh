#!/bin/sh

# dsh-super-agent repository policy:
# commits and pushes are allowed on weekdays from 18:00 (inclusive) to
# 23:30 (exclusive), and on weekends from 10:00 (inclusive) to 22:00
# (exclusive), using Asia/Singapore.
set -eu

action=${1:-git operation}
timezone=Asia/Singapore
export TZ="$timezone"

set -- $(date '+%u %H %M')
weekday=$1
hour=${2#0}
minute=${3#0}
hour=${hour:-0}
minute=${minute:-0}
now_minutes=$((hour * 60 + minute))

if [ "$weekday" -le 5 ]; then
  allowed_start=1080
  allowed_end=1410
  allowed_window='weekday 18:00-23:30'
else
  allowed_start=600
  allowed_end=1320
  allowed_window='weekend 10:00-22:00'
fi

if [ "$now_minutes" -lt "$allowed_start" ] || [ "$now_minutes" -ge "$allowed_end" ]; then
  printf '%s\n' "dsh-super-agent: $action blocked outside the allowed window ($allowed_window, timezone: $timezone)."
  printf '%s\n' 'Retry during the allowed evening/weekend window.'
  exit 1
fi

exit 0
