import {BadRequestException, Injectable, Logger} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import {PersistenceService} from "../database/persistence.service";
import {Workspace} from "../database/entities";


@Injectable()
export class RunsService {

  constructor(private readonly persistence: PersistenceService) {
  }
  private readonly logger = new Logger(RunsService.name);




}
