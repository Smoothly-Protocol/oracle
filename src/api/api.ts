import express, { Application } from 'express';
import cors from 'cors';
import { ValidatorRoutes, PoolRoutes, TreeRoutes } from './routes';
import { Oracle } from '../oracle';

export class API { 
  app: Application = express();
  port: number;
  oracle: Oracle ;

  constructor(_oracle: Oracle, _port: number) {
    this.port = _port;
    this.oracle = _oracle;
    this.start();
  }

  start() {
    const port = this.port;
    this.app.use(express.json());
    this.app.use(cors());
    this.configureRoutes();
    this.app.listen(port, () => {
      console.log(`API started: running on port ${port}`);
    });
  }

  configureRoutes() {
    ValidatorRoutes(this.app, this.oracle); 
    PoolRoutes(this.app, this.oracle);
    TreeRoutes(this.app, this.oracle);
  }
}



