import gulp from "gulp";
import config from "dotenv";
import clean from "gulp-clean";
import zip from "gulp-zip";
import { execSync } from "child_process";
import ftp from "vinyl-ftp";
import gutil from "gulp-util";
import AnyFS from "anyfs";
import Adapter from "anyfs-ftp-adapter";
config.config();

const { src, dest, series, parallel } = gulp;

/**
 * VARIÁVEIS GLOBAIS
 */
const ___DIR_FRONTEND = "../frontend";
const ___DIR_BACKEND = "../backend";
const ___DIR_PUBLISH = "../publish";
const ___CMD_COMPILE_FRONTEND = "ng build";
const ___CMD_COMPILE_BACKEND = "npm run build";

/**
 * compile
 */
async function compile_frontend(cb) {
  // "cd ../devplinio && ng build"
  cb(execSync(`cd ${___DIR_FRONTEND} && ${___CMD_COMPILE_FRONTEND}`));
}
gulp.task("compile:frontend", compile_frontend);

async function compile_backend(cb) {
  // cd ../back2 && npm run build
  cb(execSync(`cd ${___DIR_BACKEND} && ${___CMD_COMPILE_BACKEND}`));
}
gulp.task("compile:back", compile_backend);
gulp.task("compile", parallel(compile_frontend, compile_backend));

/**
 * CLEAN
 */
async function clean_frontend(cb) {
  return src(`${___DIR_FRONTEND}/dist`, { read: false, allowEmpty: true }).pipe(
    clean({ force: true })
  );
}
gulp.task("clean:front", clean_frontend);

async function clean_backend(cb) {
  return src(`${___DIR_BACKEND}/dist`, { read: true, allowEmpty: true }).pipe(
    clean({ force: true })
  );
}
gulp.task("clean:back", clean_backend);
async function prepare_clean(cb) {
  return src(`${___DIR_PUBLISH}`, { read: true, allowEmpty: true }).pipe(
    clean({ force: true })
  );
}
gulp.task("prepare:clean", prepare_clean);
gulp.task("clean", parallel(prepare_clean, clean_backend, clean_frontend));

/**
 * PREPARE "PUBLISH"
 */
async function prepare_frontend(cb) {
  return src("../devplinio/dist/devplinio/**/*").pipe(
    dest("../publish/server/public")
  );
}
gulp.task("prepare:front", prepare_frontend);

async function prepare_backend(cb) {
  return src("../back2/dist/**/*").pipe(dest("../publish/server"));
}
gulp.task("prepare:back", prepare_backend);
gulp.task("prepare", series(prepare_backend, prepare_frontend));

/**
 * ZIP "PUBLISH"
 */
async function zip_publish(cb) {
  return src("../publish/**/*").pipe(zip("app-pack.zip")).pipe(dest(".."));
}
gulp.task("prepare:zip", zip_publish);

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

  var globs = ["../publish/**"];

  return await src(globs, { base: "../publish/", buffer: false }).pipe(
    conn.dest("/@app")
  );
}
gulp.task("deploy", deploy);

/**
 * BUILD
 */
export const build = parallel("compile:frontend", "compile:back");
export default build;
