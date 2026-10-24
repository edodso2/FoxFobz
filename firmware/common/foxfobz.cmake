# Shared CMake for Fox Fobz firmware apps. Each app sets FOXFOBZ_APP
# (receiver|fob) and then include()s this file after project().

# Shared headers (foxfobz/protocol.h)
target_include_directories(app PRIVATE ${CMAKE_CURRENT_LIST_DIR}/include)

# Build identity: `git describe` against this app's own tags only
# (e.g. receiver-fw/v0.2.0-3-gabc123def456-dirty -> v0.2.0-3-gabc123def456-dirty),
# so other components' tags in the monorepo don't leak in. Evaluated at CMake
# configure time; scripts/build.sh forces a re-configure on every build.
execute_process(
  COMMAND git describe --match "${FOXFOBZ_APP}-fw/*" --always --dirty --abbrev=12
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
  OUTPUT_VARIABLE FOXFOBZ_FW_BUILD
  OUTPUT_STRIP_TRAILING_WHITESPACE
  ERROR_QUIET
)
if(NOT FOXFOBZ_FW_BUILD)
  set(FOXFOBZ_FW_BUILD "unknown")
endif()
string(REPLACE "${FOXFOBZ_APP}-fw/" "" FOXFOBZ_FW_BUILD "${FOXFOBZ_FW_BUILD}")
message(STATUS "Fox Fobz ${FOXFOBZ_APP} build: ${FOXFOBZ_FW_BUILD}")
target_compile_definitions(app PRIVATE FOXFOBZ_FW_BUILD="${FOXFOBZ_FW_BUILD}")
