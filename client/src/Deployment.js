//@flow
import React, {Component} from 'react';
import {FormattedDate, FormattedRelativeTime} from 'react-intl';
import {fetch} from './utils';


type Props = {
  // The kubernetes deployment we are dealing with
  deployment: string;
};


type DockerImage = {
  name: string;
};


type State = {
  deployment: any
};


class Deployment extends Component<Props, State> {

  state = {
    deployment: null
  }

  async componentWillMount() {
    try {
      const response = await fetch(`${window.BACKEND_URL}/deployment/${this.props.name}`);
      const data = await response.json();
      this.setState({deployment: data.deployment})
    }
    catch(e) {
      console.log(e);
      this.setState({error: e})
    }
  }

  render() {
    if (this.state.error) {
      return <div>Loading error occured</div>
    };
    if (!this.state.deployment) {
      return null;
    }

    const deployment = this.state.deployment.containers[0];

    return (
      <div className="Deployment">
        <h2>{this.props.name}</h2>

        {deployment.availableImages.map(image => {
          const isCurrent = image.tag == deployment.imageParts.tag;
          return <div key={image.tag} style={{background: isCurrent && 'silver'}}>
            <a href="#" onClick={(e) => this.handleDeploy(e, deployment.name, image.tag)}>{image.tag}</a>
            <span style={{color: 'gray'}}>
              <FormattedDate value={new Date(image.timeUploadedMs)} />, <FormattedRelativeTime value={new Date(image.timeUploadedMs)}/>
            </span>
          </div>
        })}
      </div>
    );
  }

  handleDeploy = async (e, containerName, newTag) => {
    e.preventDefault();

    const response = await fetch(`${window.BACKEND_URL}/deployment/${this.props.name}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        tag: newTag,
        name: containerName
      })
    });
    const data = await response.json();
    alert(JSON.stringify(data));
  }
}

export default Deployment;
