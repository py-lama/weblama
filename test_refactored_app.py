#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for the refactored WebLama application

This script tests that the refactored application works correctly by importing
the modules and creating an instance of the application.
"""

import os
import sys
import logging
from weblama.app import create_app

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def test_app_creation():
    """Test that the application can be created successfully."""
    try:
        app = create_app()
        logger.info("✅ Application created successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create application: {str(e)}")
        return False


def test_imports():
    """Test that all modules can be imported successfully."""
    modules = [
        'weblama.core.sandbox',
        'weblama.core.llm',
        'weblama.core.markdown_utils',
        'weblama.core.code_execution',
        'weblama.routes.ui_routes',
        'weblama.routes.file_routes',
        'weblama.routes.git_routes',
        'weblama.routes.api_routes'
    ]
    
    success = True
    for module in modules:
        try:
            __import__(module)
            logger.info(f"✅ Successfully imported {module}")
        except ImportError as e:
            logger.error(f"❌ Failed to import {module}: {str(e)}")
            success = False
    
    return success


if __name__ == '__main__':
    logger.info("Testing refactored WebLama application...")
    
    # Test imports
    if test_imports():
        logger.info("✅ All modules imported successfully")
    else:
        logger.error("❌ Some modules failed to import")
    
    # Test app creation
    if test_app_creation():
        logger.info("✅ Application created successfully")
    else:
        logger.error("❌ Failed to create application")
