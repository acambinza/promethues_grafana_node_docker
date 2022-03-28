var express = require('express');
var promClient = require('prom-client');
const register = promClient.register;

var app = express();

const contadorRequisicoes = new promClient.Counter({
	name: 'aula_requests_total',
	help: 'Contador de requests',
	labelNames: ['statusCode']
});

const usuariosOnline = new promClient.Gauge({
	name: 'aula_usuarios_logados_total',
	help: 'Número de usuários logados no momento'
});

const tempoDeResposta = new promClient.Histogram({
	name: 'aula_request_duration_seconds',
	help: 'Tempo de resposta da API'
});

var zeraUsuariosLogados = false;

function randn_bm(min, max, skew) {
	var u = 0, v = 0;
	while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
	while (v === 0) v = Math.random();
	let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

	num = num / 10.0 + 0.5; // Translate to 0 -> 1
	if (num > 1 || num < 0) num = randn_bm(min, max, skew); // resample between 0 and 1 if out of range
	num = Math.pow(num, skew); // Skew
	num *= max - min; // Stretch to fill range
	num += min; // offset to min
	return num;
}

setInterval(() => {
	// Incrementa contador de requisições
	var taxaDeErro = 5;
	var statusCode = (Math.random() < taxaDeErro/100) ? '500' : '200';
	contadorRequisicoes.labels(statusCode).inc();

	// Atualiza gauge de usuários logados
	var usuariosLogados = (zeraUsuariosLogados) ? 0 : 500 + Math.round((50 * Math.random()))
	usuariosOnline.set(usuariosLogados);

	// Observa tempo de resposta
	var tempoObservado = randn_bm(0, 3, 4);
	tempoDeResposta.observe(tempoObservado);
}, 20);

app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.get('/zera-usuarios-logados', function (req, res) {
	zeraUsuariosLogados = true;
	res.send('OK');
});

app.get('/retorna-usuarios-logados', function (req, res) {
	zeraUsuariosLogados = false;
	res.send('OK');
});

app.get('/metrics', async function(req, res) {
	res.set('Content-Type', register.contentType);
	res.end(await register.metrics());

})

app.listen(3001, () => {
    console.log('`Server listem at 3001')
})