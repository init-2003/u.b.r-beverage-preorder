@echo off
chcp 65001 > nul
title U.B.R Beverage Pre-Order - Package Production Release
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package_release.ps1"
pause
