exports.config = {
  application: {
    version: 'v0.2.2',
    name: "Acorn",
    host: 'http://ux.sohu.com/',
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
  }
}
