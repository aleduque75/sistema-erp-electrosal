### Acesso ao Banco de Dados (psql)

Para consultas diretas ao banco de dados via `psql`, utilize o seguinte comando, substituindo o comando SQL conforme necessário:

```bash
psql "postgresql://aleduque:electrosal123@localhost:5435/sistema_electrosal_dev" -c "SEU_COMANDO_SQL_AQUI;"
```

**Observação:**
*   **Host:** `localhost`
*   **Porta:** `5435`
*   **Usuário:** `aleduque`
*   **Senha:** `electrosal123`
*   **Banco de Dados:** `sistema_electrosal_dev`

Certifique-se de que o Docker Compose está em execução (`docker-compose ps`) e que o serviço do banco de dados está "Up (healthy)".