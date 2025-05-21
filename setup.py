#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="weblama",
    version="0.1.0",
    author="PyLama Team",
    author_email="pylama@example.com",
    description="Web editor for Markdown with Python code execution and fixing",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/py-lama/weblama",
    packages=find_packages(),
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "flask>=2.0.0",
        "markdown>=3.3.0",
        "pygments>=2.10.0",
    ],
    entry_points={
        "console_scripts": [
            "weblama=weblama.cli:main",
        ],
    },
    package_data={
        "weblama": [
            "templates/*",
            "static/css/*",
            "static/js/*",
        ],
    },
)
