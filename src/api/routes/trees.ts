import fs from "fs";
import * as path from 'path';
import { homedir } from 'os';
import { Application, Request, Response } from 'express';
import { Oracle } from '../../oracle';
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export async function TreeRoutes(app: Application, oracle: Oracle) {
  app.get('/tree/:name/:eth1Addr', async (req: Request, res: Response): Promise<void> => {
    try {
      const name: string = req.params.name;
      const eth1Addr: string = req.params.eth1Addr;
      const data: any = JSON.parse(
        fs.readFileSync(
          path.resolve(homedir(), `.smoothly/${name}.json`),
          'utf8'
        )
      );
      const tree = StandardMerkleTree.load(data);   
      for (const [i, v] of tree.entries()) {
        if (v[0] === eth1Addr.toLowerCase()) {
          res.json({
            proof: [tree.getProof(i), v[1], v[2]]
          })
        }
      }

      res.json({ proof: [] });
    } catch {
      res.json({
        status: 404,
        err: 'Tree not found' 
      })
    }
  })
}
