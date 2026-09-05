#!/bin/bash
# VIGILANCE — Root Prototype Launcher
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
exec bash "$ROOT_DIR/vigilance-prototype/start_demo.sh" "$@"
