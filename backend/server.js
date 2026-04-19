const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('config');
const path = require('path');

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

mongoose.connect(config.get('mongoURI'))
  .then(() => console.log('MongoDB connecte'))
  .catch((err) => { console.error(err.message); process.exit(1); });

app.use('/api/users', require('./routes/api/users'));
app.use('/api/personnel', require('./routes/api/personnel'));
app.use('/api/tickets', require('./routes/api/tickets'));
app.use('/api/notifications', require('./routes/api/Notifications'));
app.use('/api/admin', require('./routes/api/admin'));
app.use('/api/workflow', require('./routes/api/workflow'));
app.use('/api/push', require('./routes/api/push'));

app.get('/', (req, res) => res.json({ status: 'ok', msg: 'API running' }));

const PORT = config.get('port') || 3001;
app.listen(PORT, () => console.log('Serveur sur port ' + PORT));

const lancerEscaladeAuto = require("./jobs/escaladeJob");
lancerEscaladeAuto();
app.use('/api/bi', require('./routes/api/bi'));
app.use('/api/ia', require('./routes/api/ia'));