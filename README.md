# Builder w/ Gulp

Configure o `.env` com os seguintes parâmetros:

```powershell
# FTP
FTP_HOST=
FTP_USER=
FTP_PASS=
```

gulp --tasks
```powershell
[ ] Tasks for gulpfile.js
[ ] ├── compile:frontend
[ ] ├── compile:back
[ ] ├─┬ compile
[ ] │ └─┬ <parallel>
[ ] │   ├── compile_frontend
[ ] │   └── compile_backend
[ ] ├── clean:front
[ ] ├── clean:back
[ ] ├── prepare:clean
[ ] ├─┬ clean
[ ] │ └─┬ <parallel>
[ ] │   ├── prepare_clean
[ ] │   ├── clean_backend
[ ] │   └── clean_frontend
[ ] ├── prepare:front
[ ] ├── prepare:back
[ ] ├─┬ prepare
[ ] │ └─┬ <series>
[ ] │   ├── prepare_backend
[ ] │   └── prepare_frontend
[ ] ├── prepare:zip
[ ] ├── deploy
[ ] ├─┬ build
[ ] │ └─┬ <parallel>
[ ] │   ├── compile:frontend
[ ] │   └── compile:back
[ ] └─┬ default
[ ]   └─┬ <parallel>
[ ]     ├── compile:frontend
[ ]     └── compile:back
```