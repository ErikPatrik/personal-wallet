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
    // usa o middleware
    // retorna o statement
    return response.json(customer.statement)
})

app.listen(3333)