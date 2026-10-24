cmake_minimum_required(VERSION 3.20.0)
find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(foxfobz_fob)
target_sources(app PRIVATE src/main.c)

set(FOXFOBZ_APP fob)
include(../common/foxfobz.cmake)
