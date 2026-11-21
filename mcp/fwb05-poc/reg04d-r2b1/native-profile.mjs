// Keycloak 26.8.2 native User Profile migration for an ISOLATED realm.
// We intentionally omit unmanagedAttributePolicy; the 26.8.2 admin endpoint
// returns 400 "Cannot parse the JSON" for the explicit DISABLED value.
// Security approval also REQUIRES a real negative write/readback test.
import { OnboardingDenied } from '../reg04/onboarding.mjs';

const FWB=Object.freeze(['fwb_site_id','fwb_connection_id']);
const CORE=Object.freeze(['username','email','firstName','lastName']);
export function makeNativeFwbProfile(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||
    !Array.isArray(input.attributes)||input.attributes.length<4||
    input.attributes.length>32) throw new OnboardingDenied('native_profile_invalid');
  const attrs=input.attributes;
  const names=attrs.map(a=>a?.name);
  if(names.some(n=>typeof n!=='string')||new Set(names).size!==names.length||
    CORE.some(n=>!names.includes(n)))throw new OnboardingDenied('native_profile_core_invalid');
  const owned=FWB.map(name=>({
    name,displayName:'Forja WP Bridge '+name,
    multivalued:false,permissions:{view:['admin'],edit:['admin']}
  }));
  // Refuse pre-existing FWB field definitions: no silent overwrite of
  // privileges or validators added by another administrator.
  if(FWB.some(n=>names.includes(n)))
    throw new OnboardingDenied('native_profile_existing_field_review');
  // A complete schema is required by Keycloak. All preexisting definitions,
  // annotations, groups and validations are preserved unchanged.
  const {unmanagedAttributePolicy:_unused,...base}=input;
  return structuredClone({...base,attributes:[...attrs,...owned]});
}
export function verifyNativeFwbProfile(input){
  if(!input||!Array.isArray(input.attributes)||
    (input.unmanagedAttributePolicy!==undefined &&
     input.unmanagedAttributePolicy!==null))
    throw new OnboardingDenied('native_profile_policy_not_default');
  for(const name of FWB){
    const defs=input.attributes.filter(x=>x?.name===name);
    if(defs.length!==1)throw new OnboardingDenied('native_profile_missing_field');
    const def=defs[0];
    if(def.permissions?.edit?.length!==1||def.permissions.edit[0]!=='admin'||
      !Array.isArray(def.permissions?.view)||
      !def.permissions.view.includes('admin')||
      def.permissions.view.includes('user')||
      def.multivalued!==false)
      throw new OnboardingDenied('native_profile_permissions_invalid');
  }
  return Object.freeze({status:'SCHEMA_VALID_REQUIRES_NEGATIVE_WRITE_PROOF',
    policy:'default_implicit',managedFields:[...FWB]});
}
