# I/O

High level input and output operations for files and directories
are implemented here. They need to keep their module boundaries 
and not import from other modules, except types.

This is, because this module is used by the runtimes too, which
should not include any other code from core except io.