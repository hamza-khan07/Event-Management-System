const path = require('path');
// Exact path to backend/.env
require('dotenv').config({ path: path.join(__dirname, './../.env') });

const app = require('./app.js');
require('./config/db.js')


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
