const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json()) // aqui podemos receber json

/* CRIANDO API */

// Aqui estamos criando um banco de dados "fake" para ser alimentado após as requisições
const customers = []

// Middleware: percorre a rota e se der um next, continua, se não 
function verifyExistsAccountCPF(request, response, next) {
    //next: define se o middleware vai pra frente com a operação, ou se vai parar
    const { cpf } = request.headers;

    // busca o cliente dentro do array e recuperar o statement
    const customer = customers.find((customer) => customer.cpf === cpf) 

    // se não existir o CPF, retorna uma mensagem
    if (!customer) {
        return response.status(400).json({ error: 'Cliente não encontrado '})
    }

    // repassar a informação consumida no middleware para as demais rotas
    request.customer = customer

    //se der boa, continua
    return next()
}

//Criando uma conta
//Esta conta possui: cpf(string), name(string), id(uuid), statement/extratos(array)
app.post('/account', (request, response) => {
    const { cpf, name } = request.body // desestruturo que vem do body

    const verifyExistsCpf = customers.some((customer) => 
        customer.cpf === cpf) //busca dentro do vetor se existe um cpf já existe

    if (verifyExistsCpf) {
        response.status(400).json({error: "CPF já existente"})
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    }) //inserir dados dentro um array

    //Aqui retornamos se deu certo com o status 201
    return response.send(201)
})

// assim, todas as minhas rotas verificam tal função
// app.use(verifyExistsAccountCPF)

// Buscar o extrato do cliente usando route headers e tem middleware
app.get('/statement', verifyExistsAccountCPF, (request, response) => {
    const { customer } = request

    // usa o middleware
    // retorna o statement    
    return response.json(customer.statement)
})

// Aqui vamos inserir um depósito
// informações: descrição e amount(quantia)
app.post('/deposit', verifyExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body

    const { customer } = request

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation)

    return response.send(201).send()
})

// Busca extrato através da data bancária através de query params
app.get('/statement/date', verifyExistsAccountCPF, (request, response) => {
    const { customer } = request
    const { date } = request.query

    const dateFormat = new Date(date + " 00:00") // busca em qualquer horário do dia

    // busca nos statements as datas, conforme data desta forma 10/12/2021
    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    console.log(statement)

    return response.json(customer.statement)
})

// Atualizar os dados do cliente
app.put('/account', verifyExistsAccountCPF, (request, response) => {
    const { name } = request.body
    const { customer } = request

    customer.name = name

    return response.status(201).send()
})

// Obter dados da conta
app.get('/account', verifyExistsAccountCPF, (request, response) => {
    const { customer } = request

    return response.json(customer)
})

// Deletar conta
app.delete('/account', verifyExistsAccountCPF, (request, response) => {
    const { customer } = request

    // splice, recebe 2 parametros (onde inicia, até aonde espera que a remoção vá)
    customers.splice(customer, 1) // remove uma posição após o customer

    return response.status(200).json(customers) // envia os customers que restaram

})

app.listen(3333)