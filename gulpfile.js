import gulp from "gulp";
import config from "dotenv";
import clean from "gulp-clean";
import zip from "gulp-zip";
import { execSync } from "child_process";
import ftp from "vinyl-ftp";
import gutil from "gulp-util";
config.config();

const { src, dest, series, parallel } = gulp;

/**
 * VARIÁVEIS GLOBAIS
 */
const ___NAME_FRONTEND = "frontend";
const ___NAME_BACKEND = "backend";

const ___DIR_FRONTEND = `../${___NAME_FRONTEND}`;
const ___DIR_BACKEND = `../${___NAME_BACKEND}`;
const ___CMD_COMPILE_FRONTEND = "npm run build --emptyOutDir";
const ___CMD_COMPILE_BACKEND = "build.bat";

const ___DIR_PUBLISH = "../publish";
const ___DIR_PUBLISH_FRONTEND = "/public";
const ___DEST_SERVER_SIDE = "/sistema";

// BOOLEANOS

const externalSqlite3 = false;

/**
 * compile
 */
async function compile_frontend(cb) {
  let res = execSync(`cd ${___DIR_FRONTEND} && ${___CMD_COMPILE_FRONTEND}`);
  setTimeout(cb, 1000);
}
gulp.task("compile:frontend", compile_frontend);

async function compile_backend(cb) {
  let res = execSync(`cd ${___DIR_BACKEND} && ${___CMD_COMPILE_BACKEND}`);
  setTimeout(cb, 1000);
}
gulp.task("compile:backend", compile_backend);
gulp.task("compile", parallel(compile_frontend, compile_backend, add_include_to_publish));

/**
 * CLEAN
 */
async function clean_frontend(cb) {
  return await src(`${___DIR_FRONTEND}/dist`, {
    read: false,
    allowEmpty: true,
  }).pipe(clean({ force: true }));
}
gulp.task("clean:frontend", clean_frontend);

async function clean_backend(cb) {
  return await src(`${___DIR_BACKEND}/dist`, {
    read: true,
    allowEmpty: true,
  }).pipe(clean({ force: true }));
}
gulp.task("clean:backend", clean_backend);
async function publish_clean(cb) {
  return await src(`${___DIR_PUBLISH}`, { read: true, allowEmpty: true }).pipe(
    clean({ force: true })
  );
}
gulp.task("publish:clean", publish_clean);
gulp.task("clean", parallel(publish_clean));

/**
 * ZIP "PUBLISH"
 */
async function zip_publish(cb) {
  return await src(`${___DIR_PUBLISH}/**/*`)
    .pipe(zip("app-pack.zip"))
    .pipe(dest(".."));
}
gulp.task("publish:zip", zip_publish);

/**
 * FTP "PUBLISH"
 */
async function deploy(cb) {
  const config = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    pass: process.env.FTP_PASS,
    port: 21,
  };

  var conn = ftp.create({ ...config, parallel: 1, log: gutil.log });

  var globs = [`${___DIR_PUBLISH}/**/*`, `${___DIR_PUBLISH}/.env*`];

  return await src(globs, { base: `${___DIR_PUBLISH}/`, buffer: false })
    .pipe(conn.newer(`${___DEST_SERVER_SIDE}`))
    // .pipe(conn.dest(`/`));
    .pipe(conn.dest(`${___DEST_SERVER_SIDE}`));
}
gulp.task("deploy", deploy);
async function deploy_force(cb) {
  const config = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    pass: process.env.FTP_PASS,
    port: 21,
  };

  var conn = ftp.create({ ...config, parallel: 1, log: gutil.log });

  var globs = [`${___DIR_PUBLISH}/**/*`, `${___DIR_PUBLISH}/.env`];

  return await src(globs, { base: `${___DIR_PUBLISH}/`, buffer: false }).pipe(
    // conn.dest(`${___DEST_SERVER_SIDE}`)
    conn.dest(`/`)
  );
}
gulp.task("deploy:force", deploy_force);

/**
 * TASK DE WAIT
 */
function wait(cb) {
  setTimeout(cb, 1000);
}
gulp.task("wait1000", wait);

/**
 * BUILD
 */
// export const build = parallel("compile:frontend", "compile:backend");
// export const build = series(
//   series(clean_backend, clean_backend, publish_clean),
//   "compile",
//   series(publish_backend, publish_frontend)
// );
export const build = series(
  "clean",
  "compile",
  "wait1000",
  "deploy"
);
export default build;



function make_dist_backend(cb) {
  let res = execSync(`cd ${___DIR_BACKEND} && ${___CMD_COMPILE_BACKEND}`);
  return cb();
}
async function move_dist_backend_to_publish(cb) {
  return await src(`${___DIR_BACKEND}/dist/**/*`).pipe(
    dest(`${___DIR_PUBLISH}`)
  );
}
function make_dist_frontend(cb) {
  let res = execSync(`cd ${___DIR_FRONTEND} && ${___CMD_COMPILE_FRONTEND}`);
  return cb();
}
async function move_dist_frontend_to_publish(cb) {
  return await src(`../${___NAME_FRONTEND}/build/client/**/*`).pipe(
    dest(`${___DIR_PUBLISH}${___DIR_PUBLISH_FRONTEND}`)
  );
}

async function add_include_to_publish(cb) {
  return await src(`../includes/**/*`, { dot: true }).pipe(
    dest(`${___DIR_PUBLISH}`)
  );
}

gulp.task("make_backend", series(make_dist_backend, move_dist_backend_to_publish));
gulp.task("make_frontend", series(make_dist_frontend, move_dist_frontend_to_publish));
gulp.task("add_include_to_publish", add_include_to_publish);
gulp.task("make_dist", series(parallel("make_backend", "make_frontend"), "add_include_to_publish"));