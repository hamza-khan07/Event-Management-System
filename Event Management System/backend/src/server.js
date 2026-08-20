const app = require('./app.js');
require('./config/db.js')


app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
})