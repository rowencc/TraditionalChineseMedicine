<?php
namespace Core;

class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        $config = require __DIR__ . '/config.php';
        $dsn = "mysql:host={$config['database']['host']};dbname={$config['database']['database']};charset={$config['database']['charset']}";
        $this->pdo = new \PDO($dsn, $config['database']['username'], $config['database']['password']);
        $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    public function execute($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
    
    /** 供需要事务/原生 PDO 的场景使用（如知识库同步） */
    public function getPdo() {
        return $this->pdo;
    }

    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }
    
    public function count($table, $where = '1=1', $params = []) {
        $result = $this->query("SELECT COUNT(*) as count FROM {$table} WHERE {$where}", $params);
        return (int)$result[0]['count'];
    }
}
