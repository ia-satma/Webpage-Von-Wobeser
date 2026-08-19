/**
 * Hashes de recursos locales fijos que se incluyen en el espejo público.
 *
 * Se mantienen versionados para que una modificación inesperada de una
 * dependencia haga que el navegador la rechace. Al actualizar alguno de estos
 * archivos se debe recalcular su SHA-384 antes de publicar.
 */
export const LOCAL_SRI_MANIFEST: Readonly<Record<string, string>> = {
  "/attorney-directory.js": "sha384-4JrBO+CitlCQ3L0kio2QxFsJQhjS12U5evFHx3AmzSlkrhrFyUYN2fbCEQsRcguH",
  "/_vendor/aos/aos.css": "sha384-6oNXtl81GMcKAnWPPXinWlPskKUQ0NGG1/XeyMfC5RgCJKPc03w0rHVt1jyoJLf0",
  "/_vendor/aos/aos.js": "sha384-ZGo5k5ISlEzWLoXyt+lnvKt9j03Z7GkxXh14zLqVy098XJhcdKHjL8pQYVMI8WiH",
  "/_vendor/bootstrap-icons/bootstrap-icons.min.css": "sha384-jiNSPb/W24B/Z+B37jzOcv8oxVfSWg0L25KWJgYoq7mmVVAuQdJAYmEBoZKFh5GU",
  "/_vendor/bootstrap/bootstrap.bundle.min.js": "sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL",
  "/_vendor/bootstrap/bootstrap.min.css": "sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN",
  "/_vendor/fontawesome/all.css": "sha384-kp0L2bQlsj0l6f/geVgwG42q8MJtdNdBShzXJbNoelU1xh9OU3rkb6j+4fiJtyr4",
  "/_vendor/jquery/jquery-3.7.1.min.js": "sha384-1H217gwSVyLSIfaLxHbE7dRb3v4mYCKbpQvzx0cegeju1MVsGrX5xXxAvs/HgeFs",
  "/_vendor/slick/slick.css": "sha384-15uvY5+i2S8TYxd43U+tQKe816etfaw5Nuo/UuLmQutVtunPEPslyk47/prxTXI6",
  "/_vendor/sweetalert2/sweetalert2.all.min.js": "sha384-v5sCAl8qZOHabzoh1+noJcE2yaDE9V/9+mBHgmxFdpiY5chhD/Qf1rQ7igh8ew0q",
  "/css/estilos_home.css": "sha384-eBjS0H06sydTfK5e3dmW9o7FCDY92aM0pnuLl6EloOkmIWj6nCjdVwYJttKY6PDr",
  "/templates/beez3/css/ie7only.css": "sha384-G6ybb7/As3FRY6Xh6pOOSuuz0JhYVVcwejGdDYcl+NQWVEQ4lI9f2qbmP51Pqk/u",
  "/templates/beez3/css/print.css": "sha384-UYxdMiNRTL5AFHzWZ/ly4jvbWTTBZP62vToqX3cOo9XF9/3F1QosKtOhZB+4rk7J",
  "/templates/beez3/css/style.css": "sha384-Pk0YxIfo/lG6lTqM6sUrLScLFFDiddhHZve/U96GD2yaJy2Rq0iNlB3vS0wHY0XF",
  "/templates/beez3/css/superslides.css": "sha384-z+22ma06Yj+RzvrnLIdIbqpLNw4zO+xMxfyjYGOAFOrf7MB8v1hi2958Kh/phTd4",
  "/templates/beez3/css/typography.css": "sha384-J+4WYxRlDivccMdkMkdFP0uXciQKHOeFm3NcFKDVDDBPuKMYka5fSNe3xbFql6n3",
  "/templates/beez3/css/von.css": "sha384-axEd9LfKwnOma9XlrJFcX+3r9gn/erlAkcTZQ1GFRV1JIJcHOtVa+4wp6Mo/7Skr",
  "/templates/beez3/javascript/jquery.animate-enhanced.min.js": "sha384-hBwyjIe2YAjxdmu4EQGiMrVR608DAhC+WLtQA0vqrd6F6pezYXKWoedQCnOXJ/4R",
  "/templates/beez3/javascript/jquery.easing.1.3.js": "sha384-MM5zsVvrGlQFmN1sWfTOj9JjMl0Gq4xJ8s/nBc2iPfG/XwziF9SGiLpI/v+PIHfi",
  "/templates/beez3/javascript/jquery.superslides.js": "sha384-H1HAmtf0gza6L5UL+wMlgdXIp6YOgNXcoghCRC38+M79RzQNeW8YRqKjpSp9FQhy",
  "/templates/beez3/javascript/jquery.validate.js": "sha384-+vCt/78pIN+jFcfd+lh/YZGx5bTDb0rcHVG69A7fi+PMeyneQpHi1Zb70K/PzMMs",
  "/templates/beez3/js/min/functions.min.js": "sha384-AjM4W6exMPHQGIePNbOCRNNYiI1OEQ94g2kqFjrV53LXsAnUwtgiOBsSD8eK3Dtu",
  "/templates/beez3/js/min/slick.min.js": "sha384-JwfvGWhM8DLW0rzE6JNW0wcEsnmGiP6TmWkTHNsuA3r6JcOtJVwCdgBXOOUWlv6G",
  "/vwb-privacy-preferences.css": "sha384-vvBYt5kv7DnC/cIhse4ARA2FjkLebQpbBFGOXTVpBmr9Cs52GYdGfO4dETPxBo7O",
  "/vwb-privacy-preferences.js": "sha384-8Lwn/pZn+FPHZY6WN0A6T7DkTTF4CSwBEDdJvm+KVJyYIhtU+ucs3bGab9+TwqdR",
  "/vwb-cookie-consent.css": "sha384-vvBYt5kv7DnC/cIhse4ARA2FjkLebQpbBFGOXTVpBmr9Cs52GYdGfO4dETPxBo7O",
  "/vwb-cookie-consent.js": "sha384-8Lwn/pZn+FPHZY6WN0A6T7DkTTF4CSwBEDdJvm+KVJyYIhtU+ucs3bGab9+TwqdR",
  "/vwb-legacy-events.js": "sha384-/uK7MT/KUJxTkm0sshzn9npwccNY5lWRAW0uHNKdMi2/TnAmgOdc8zISVFNnsud7",
};
