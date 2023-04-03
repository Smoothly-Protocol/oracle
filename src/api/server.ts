import express from 'express';
import cors from 'cors';
import { routes } from './routes';

const app: express.Application = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

app.use('/', routes);

app.listen(port, () => {
  console.log(`API started: running on port ${port}`);
});
