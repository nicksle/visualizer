/* Renders a build's preview thumbnail. Uses the stored screenshot if available,
   otherwise shows a placeholder. */
export default function BuildThumb({ presetData, size = 40 }){
  if(presetData?.thumb){
    return (
      <img
        className="build-thumb"
        src={presetData.thumb}
        style={{ width:size, height:size }}
        alt=""
      />
    );
  }

  return (
    <div
      className="build-thumb build-thumb-empty"
      style={{ width:size, height:size }}
    />
  );
}
