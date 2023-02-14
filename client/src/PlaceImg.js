const BASE_URL = "https://booking-app-backend-production-0ead.up.railway.app";

export default function PlaceImg({place,index=0,className=null}) {
  if (!place.photos?.length) {
    return '';
  }
  if (!className) {
    className = 'object-cover';
  }
  return (
    <img className={className} src={`${BASE_URL}/uploads/`+place.photos[index]} alt=""/>
  );
}