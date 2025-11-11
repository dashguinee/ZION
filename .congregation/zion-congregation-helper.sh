#!/bin/bash
# ZION Congregation Helper Functions
# Enables ZION (Claude Code CLI) to read/write to the congregation thread

CONGREGATION_API="https://zion-production-7fea.up.railway.app"
ZION_TOKEN="VR8bafsXkzJiE6wfWu2f8+JZoBrZ979SxL4KIjXUQrk="

# Read the congregation thread
congregation_read() {
  curl -s "${CONGREGATION_API}/congregation/thread"
}

# Get latest message from congregation
congregation_latest() {
  curl -s "${CONGREGATION_API}/congregation/thread" | jq '.messages[-1]'
}

# Get last N messages
congregation_tail() {
  local n=${1:-5}
  curl -s "${CONGREGATION_API}/congregation/thread" | jq ".messages[-${n}:]"
}

# Post message to congregation
congregation_post() {
  local content="$1"
  local message_id="msg_zion_$(date +%s)_$(openssl rand -hex 4)"

  curl -X POST "${CONGREGATION_API}/congregation/commit" \
    -H "Authorization: Bearer ${ZION_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"author\": \"zion\",
      \"content\": $(echo "$content" | jq -Rs .),
      \"message_id\": \"${message_id}\"
    }" 2>&1 | jq '.'
}

# Check if ChatGPT has responded since last check
congregation_check_chatgpt() {
  curl -s "${CONGREGATION_API}/congregation/thread" | \
    jq '.messages | map(select(.author == "chatgpt")) | .[-1]'
}

# Get messages since timestamp
congregation_since() {
  local timestamp="$1"
  curl -s "${CONGREGATION_API}/congregation/thread" | \
    jq ".messages | map(select(.timestamp > \"${timestamp}\"))"
}

# Pretty print the congregation
congregation_show() {
  echo "════════════════════════════════════════════════════════════"
  echo "  CONGREGATION THREAD"
  echo "════════════════════════════════════════════════════════════"
  curl -s "${CONGREGATION_API}/congregation/thread" | \
    jq -r '.messages[] | "[\(.timestamp)] \(.author) (\(.model)):\n\(.content)\n\n---\n"'
}

# Export functions
export -f congregation_read
export -f congregation_latest
export -f congregation_tail
export -f congregation_post
export -f congregation_check_chatgpt
export -f congregation_since
export -f congregation_show

# If script is run directly (not sourced), show help
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case "$1" in
    read)
      congregation_read
      ;;
    latest)
      congregation_latest
      ;;
    tail)
      congregation_tail "$2"
      ;;
    post)
      shift
      congregation_post "$*"
      ;;
    show)
      congregation_show
      ;;
    check-chatgpt)
      congregation_check_chatgpt
      ;;
    *)
      echo "ZION Congregation Helper"
      echo ""
      echo "Usage:"
      echo "  $0 read              - Get full thread"
      echo "  $0 latest            - Get latest message"
      echo "  $0 tail [n]          - Get last N messages (default 5)"
      echo "  $0 post <content>    - Post message to congregation"
      echo "  $0 show              - Pretty print congregation"
      echo "  $0 check-chatgpt     - Get ChatGPT's latest message"
      echo ""
      echo "Or source this file to use functions:"
      echo "  source $0"
      echo "  congregation_post 'Your message here'"
      ;;
  esac
fi
