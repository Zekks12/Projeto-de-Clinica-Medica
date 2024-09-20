const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;
// Configurando o uso de arquivos estáticos (CSS, JS, Imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Configurando o body-parser para tratar dados enviados via POST
app.use(bodyParser.urlencoded({
    extended: true
}));

// Conectando ao banco de dados SQLite
const db = new sqlite3.Database(path.join(__dirname, 'clinica.db'), (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

// Criando a tabela Pacientes, se ela ainda não existir
db.run(`CREATE TABLE IF NOT EXISTS pacientes (
 cpf TEXT PRIMARY KEY,
 nome TEXT NOT NULL,
 idade INTEGER NOT NULL,
 dia_marcado TEXT NOT NULL, hora_marcada TEXT NOT NULL
)`);

// Configurando o Express para usar EJS como view engine
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

// Middleware para tratar erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

// Rota principal (Home) - Exibe a página inicial
app.get('/', (req, res) => {
    res.render('index');
});

// Rota para exibir o formulário de inserção de paciente
app.get('/inserir', (req, res) => {
    res.render('inserir');
});

// Rota para processar a inserção de um novo paciente
app.post('/inserir', (req, res) => {
    const {
        cpf,
        nome,
        idade,
        dia_marcado,
        hora_marcada
    } = req.body;

    if (!validarCPF(cpf)) {
        return res.status(400).send('CPF inválido.');
    }

    // Inserir paciente no banco de dados
    db.run(`INSERT INTO pacientes (cpf, nome, idade, dia_marcado, hora_marcada) VALUES (?, ?, ?, ?, ?)`,
        [cpf, nome, idade, dia_marcado, hora_marcada],
        (err) => {
            if (err) {
                return res.status(500).send('Erro ao inserir paciente.');
            }
            res.redirect('/listar');
        }
    );
});

// Rota para listar pacientes
app.get('/listar', (req, res) => {
    db.all(`SELECT * FROM pacientes`, [], (err, rows) => {
        if (err) {
            return res.status(500).send('Erro ao listar pacientes.');
        }
        res.render('listar', {
            pacientes: rows
        });
    });
});

// Rota para exibir o formulário de atualização de paciente
app.get('/atualizar/:cpf', (req, res) => {
    const cpf = req.params.cpf;
    const paciente =
        res.render('atualizar', {
            paciente
        });
    db.get(`SELECT * FROM pacientes WHERE cpf = ?`, [cpf], (err, paciente) => {
        if (err) {
            return res.status(500).send('Erro ao buscar paciente.');
        }
        if (!paciente) {
            return res.status(404).send('Paciente não encontrado.');
        }
        res.render('atualizar', {
            paciente
        });
    });
});

// Rota para processar a atualização de um paciente
app.post('/atualizar/:cpf', (req, res) => {
    const cpf = req.params.cpf;
    const {
        nome,
        idade,
        dia_marcado,
        hora_marcada
    } = req.body;

    // Atualizando dados no banco de dados
    db.run(`UPDATE pacientes SET nome = ?, idade = ?, dia_marcado = ?, hora_marcada = ? WHERE cpf = ?`,
        [nome, idade, dia_marcado, hora_marcada, cpf],
        (err) => {
            if (err) {
                return res.status(500).send('Erro ao atualizar paciente.');
            }
            res.redirect('/listar');
        }
    );
});

// Rota para deletar paciente
app.get('/deletar/:cpf', (req, res) => {
    const cpf = req.params.cpf;

    db.run(`DELETE FROM pacientes WHERE cpf = ?`, [cpf], (err) => {
        if (err) {
            return res.status(500).send('Erro ao deletar paciente.');
        }
        res.redirect('/listar');
    });
});

// Função para validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !/^\d{11}$/.test(cpf)) return false;

    // Validação do dígito verificador
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
}

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});