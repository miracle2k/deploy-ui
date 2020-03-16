import React from "react";
import {Link} from "react-router-dom";
import {GROUPS} from './DeploymentGroup';


export function Index(props: any) {
  return <div>
    {
      Object.keys(GROUPS).map(name => {
        return <li key={name}><Link to={`/group/${name}`}>{name}</Link></li>
      })
    }
  </div>
}