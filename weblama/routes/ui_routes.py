#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UI routes for WebLama

This module provides Flask routes for the web interface.
"""

import os
from flask import Blueprint, render_template, send_from_directory, current_app
from weblama.logger import logger

# Create a blueprint for UI routes
ui_routes = Blueprint('ui_routes', __name__)


@ui_routes.route('/')
def index():
    """Render the main page.
    
    Returns:
        The rendered index.html template
    """
    logger.debug("Rendering index page")
    return render_template('index.html')


@ui_routes.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files.
    
    Args:
        filename (str): The path to the static file
        
    Returns:
        The requested static file
    """
    static_folder = os.path.join(current_app.root_path, 'static')
    return send_from_directory(static_folder, filename)
