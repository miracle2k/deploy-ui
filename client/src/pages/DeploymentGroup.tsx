import React from "react";
import {Deployment} from "../Deployment";

export const GROUPS: {[key: string]: string[]} = {
  'emojigram': [
      'emojigram/emojigram'
  ],
  'languagetool': [
    'languagetool/farsi-school',
    'languagetool/dbserver',
    'languagetool/market',
  ],
  'deploy-ui': [
    'kube-system/deploy-ui'
  ],
  'feedbackwidget': [
    'feedbackwidget/app',
    'feedbackwidget/bot',
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