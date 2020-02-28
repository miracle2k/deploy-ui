import React from "react";
import {Link} from "react-router-dom";

export function Index(props: any) {
  return <div>
    {
      ['emojigram', 'languagetool', 'deploy-ui'].map(name => {
        return <li><Link to={`/group/${name}`}>{name}</Link></li>
      })
    }
  </div>
}