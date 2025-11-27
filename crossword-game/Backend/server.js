const express = require('express');
const cors = require('cors');
const levelRoutes = require('./routes/levelRoutes');

const app = express();
const PORT = 4001;


app.use(cors()); 
app.use(express.json()); 

app.use('/api', levelRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});