# VWyS image-size guard

`pptxgenjs@4.0.1` declares `image-size` as a dependency even though its Node runtime bundle does not import it. The published `image-size` releases are affected by infinite-loop parsers for ICNS, JXL and HEIF files.

This local package replaces that unused dependency with a fail-closed API. Any future attempt to invoke it throws `ERR_VWYS_IMAGE_SIZE_DISABLED`; presentation images must continue through the validated Sharp pipeline and the existing JPEG, PNG, GIF and WebP allowlist.

The supply-chain tests verify both assumptions: the PPTX runtime must not import `image-size`, and unsupported image formats must remain rejected.
