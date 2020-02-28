import React from "react";
import {Deployment} from "../Deployment";

const GROUPS: {[key: string]: string[]} = {
  'emojigram': [
      'emojigram/emojigram'
  ],
  'languagetool': [
    'languagetool/farsi-school'
  ],
  'deploy-ui': [
    'kube-system/deploy-ui'
  ],
};


export function DeploymentGroup(props: {
  group: string
}) {
  return <div>
    {GROUPS[props.group].map(name => {
      return <Deployment name={name} />;
    })}
  </div>
}