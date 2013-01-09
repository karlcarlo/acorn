module.exports = {
  application: {
    version: 'v0.2.3',
    title: "Acorn Blog",
    name: "Acorn",
    host: '', // http://127.0.0.1/
    port: 3000,
    root_account: 'root@localhost'
  },
  session: {
    secret: "acorn_blog"
  },
  database: {
    url: "mongodb://127.0.0.1/acorn_blog"
  },
  cookie: {
    name: 'acorn'
  },
  allow_image_types: /\.(gif|jpe?g|png)$/i,
  thumbs: {
    s: {
      width: 80,
      height: 60
    },
    m: {
      width: 120,
      height: 90
    },
    b: {
      width: 240,
      height: 160
    },
    l: {
      width: 960
    }
  }
}
