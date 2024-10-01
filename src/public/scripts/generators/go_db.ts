import { CodeGenerator } from '../core/structure';

export class GoDatabase extends CodeGenerator {
        Run() {
                let code = `type DBConfig struct {
    User     string
    Password string
    DBName   string
    Host     string
    Port     string
}

type App struct {
    Router *mux.Router
    DB     *sql.DB
}

func NewDB(config DBConfig) (*sql.DB, error) {
    connStr := "user=" + config.User + " password=" + config.Password + " dbname=" + config.DBName + " host=" + config.Host + " port=" + config.Port + " sslmode=disable"
    return sql.Open("postgres", connStr)
}
    `;

                this.output = {
                        '/internal/config/db.go': code,
                };
                return this;
        }
}
