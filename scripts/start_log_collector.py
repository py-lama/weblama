#!/usr/bin/env python3
"""
Helper script to start the LogLama log collector for WebLama logs.

This script is designed to be run when WebLama starts to ensure that
WebLama logs are automatically collected and imported into LogLama.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

# Try to find the LogLama module
def find_loglama():
    # Check if loglama is already in the path
    try:
        import loglama
        return True
    except ImportError:
        pass
    
    # Try to find loglama in the standard location
    current_dir = Path(__file__).parent.absolute()
    pylama_root = current_dir.parent.parent.parent
    loglama_path = pylama_root / 'loglama'
    
    if loglama_path.exists() and loglama_path not in sys.path:
        sys.path.insert(0, str(loglama_path))
        try:
            import loglama
            return True
        except ImportError:
            pass
    
    return False


def start_collector(interval=300, verbose=False, background=True):
    """
    Start the LogLama log collector for WebLama logs.
    
    Args:
        interval: Collection interval in seconds
        verbose: Show verbose output
        background: Run in the background
    """
    # Check if LogLama is available
    if not find_loglama():
        print("LogLama not found. Cannot start log collector.")
        return False
    
    try:
        # Import LogLama modules
        from loglama.collectors.scheduled_collector import run_collector
        from loglama.config.env_loader import get_env
        
        if background:
            # Run in the background using subprocess
            cmd = [sys.executable, '-m', 'loglama.collectors.scheduled_collector',
                   '--components', 'weblama', '--interval', str(interval)]
            
            if verbose:
                cmd.append('--verbose')
            
            # Create log directory if it doesn't exist
            log_dir = Path(get_env('LOGLAMA_LOG_DIR', 'logs'))
            log_dir.mkdir(exist_ok=True)
            
            # Open log file
            log_file = open(log_dir / 'weblama_collector.log', 'a')
            
            # Start the process
            process = subprocess.Popen(
                cmd,
                stdout=log_file,
                stderr=log_file,
                close_fds=True,
                start_new_session=True
            )
            
            # Print success message
            print(f"Started WebLama log collector with PID {process.pid}")
            print(f"Logs are being written to {log_dir / 'weblama_collector.log'}")
            
            # Write PID to file for later management
            with open(log_dir / 'weblama_collector.pid', 'w') as f:
                f.write(str(process.pid))
            
            return True
        else:
            # Run in the foreground
            print(f"Starting WebLama log collector")
            print(f"Collection interval: {interval} seconds")
            
            # Run the collector
            run_collector(components=['weblama'], interval=interval, verbose=verbose)
            return True
    
    except Exception as e:
        print(f"Error starting WebLama log collector: {e}")
        return False


def main():
    """
    Main entry point for the script.
    """
    parser = argparse.ArgumentParser(description="Start the LogLama log collector for WebLama logs")
    parser.add_argument("--interval", "-i", type=int, default=300, 
                        help="Collection interval in seconds (default: 300)")
    parser.add_argument("--verbose", "-v", action="store_true", 
                        help="Show verbose output")
    parser.add_argument("--foreground", "-f", action="store_true", 
                        help="Run in the foreground instead of as a daemon")
    
    args = parser.parse_args()
    
    # Start the collector
    success = start_collector(
        interval=args.interval,
        verbose=args.verbose,
        background=not args.foreground
    )
    
    # Exit with appropriate status code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
