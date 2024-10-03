import { CodeGenerator } from '../../core/structure';

export class GoDatabase extends CodeGenerator {
        Run() {
                let code = `package config
                
import "database/sql"

type DBConfig struct {
    User     string
    Password string
    DBName   string
    Host     string
    Port     string
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
