#!/usr/bin/env node
import { verifyStageConfiguration } from '../../mcp/fwb05-poc/reg04d-r1/staging-preflight.mjs';
// Deliberately never print values of env, tokens, DB URLs or key material.
try{
  const reviewed=verifyStageConfiguration(process.env);
  console.log('FWB_REG04D_R1_STAGE_CONFIGURATION_REVIEWED_NOT_DEPLOYED');
  console.log(JSON.stringify(reviewed));
}catch(error){
  console.error('FWB_REG04D_R1_STAGE_NO_GO',error?.code||'unspecified');
  process.exitCode=2;
}
