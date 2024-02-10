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
const ___CMD_COMPILE_FRONTEND = "ng build --configuration=production";
const ___CMD_COMPILE_BACKEND = "nest build";

const ___DIR_PUBLISH = "../publish";
const ___DIR_PUBLISH_FRONTEND = "/frontend";
const ___DEST_SERVER_SIDE = "/app";

/**
 * compile
 */
async function compile_frontend(cb) {
  let res = execSync(`cd ${___DIR_FRONTEND} && ${___CMD_COMPILE_FRONTEND}`);
  // console.log(res.toString());
  setTimeout(cb, 1000);
}
gulp.task("compile:frontend", compile_frontend);

async function compile_backend(cb) {
  let res = execSync(`cd ${___DIR_BACKEND} && ${___CMD_COMPILE_BACKEND}`);
  let res2 = execSync(
    `ncc build ${___DIR_BACKEND}/dist/main.js -o ${___DIR_BACKEND}/dist/ncc`
  );
  // console.log(res.toString());
  console.log("####");
  setTimeout(cb, 1000);
}
gulp.task("compile:backend", compile_backend);
gulp.task("compile", parallel(compile_frontend, compile_backend));

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
gulp.task("clean", parallel(publish_clean, clean_backend, clean_frontend));

/**
 * publish "PUBLISH"
 */
async function publish_frontend(cb) {
  return await src(`../${___NAME_FRONTEND}/dist/${___NAME_FRONTEND}/**/*`).pipe(
    dest(`${___DIR_PUBLISH}${___DIR_PUBLISH_FRONTEND}`)
  );
}
gulp.task("publish:frontend", publish_frontend);

async function publish_backend(cb) {
  await src(`${___DIR_BACKEND}/.env`).pipe(dest(`${___DIR_PUBLISH}/backend`));
  return await src(`${___DIR_BACKEND}/dist/ncc/**/*`).pipe(
    dest(`${___DIR_PUBLISH}/backend`)
  );
}
gulp.task("publish:backend", publish_backend);
gulp.task("publish", series(publish_backend, publish_frontend));

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

  var globs = [`${___DIR_PUBLISH}/**/*`, `${___DIR_PUBLISH}/backend/.env`];

  return await src(globs, { base: `${___DIR_PUBLISH}/`, buffer: false })
    .pipe(conn.newer(`${___DEST_SERVER_SIDE}`))
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

  var globs = [`${___DIR_PUBLISH}/**/*`, `${___DIR_PUBLISH}/backend/.env`];

  return await src(globs, { base: `${___DIR_PUBLISH}/`, buffer: false }).pipe(
    conn.dest(`${___DEST_SERVER_SIDE}`)
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
  "publish",
  "wait1000",
  "deploy"
);
export default build;
