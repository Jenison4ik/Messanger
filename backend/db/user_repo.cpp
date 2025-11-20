#include "user_repo.h"

UserRepository::UserRepository(pqxx::connection& conn) : db(conn) {}

std::vector<User> UserRepository::getAllUsers() {
    // Открываем транзакцию уровня work (read/write). Она автоматически
    // отменится, если не вызвать commit() из-за исключения.
    pqxx::work txn(db);

    // Простое чтение всех строк. Здесь можно добавить ORDER BY/WHERE позже.
    auto result = txn.exec("SELECT id, username FROM users");
    txn.commit();

    std::vector<User> users;
    for (auto row : result) {
        users.push_back(User{
            row["id"].as<int>(),          // Конвертируем значение столбца в int.
            row["username"].c_str()       // c_str() создаёт std::string.
        });
    }
    return users;
}

int UserRepository::createUser(const std::string& username) {
    pqxx::work txn(db);

    // Используем параметризованный запрос для защиты от SQL-инъекций.
    auto result = txn.exec_params(
        "INSERT INTO users (username) VALUES ($1) RETURNING id;",
        username
    );

    int id = result[0]["id"].as<int>();  // В новой строке всегда будет ровно один id.
    txn.commit();
    return id;
}
