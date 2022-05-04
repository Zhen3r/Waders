
let map = L.map('map', {
  center: mapCenter,
  zoom: 2,
  scrollWheelZoom: false,
  zoomSnap: 0.001,
  dragging: false,
  // preferCanvas: true,
});

map.on('click', (e) => {
  let xy = e.latlng;
  console.log(xy.lat, xy.lng);
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
}).addTo(map);

// L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
//   maxZoom: 20,
//   attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
// }).addTo(map);

let allLayers = L.layerGroup().addTo(map);
map.createPane('traced');
map.createPane('poly');

// https://stackoverflow.com/questions/34897704/use-svg-as-map-using-leaflet-js

class Camera {
  constructor(map1) {
    this.map = map1;
    this.zoom = this.map.getZoom();

    // this.animationLoop;
    // this.then = Date.now();
    // this.v = 0.2; // pixel per frame
    // this.frameRate = 60;
    // this.draw = this.draw.bind(this);
    this.update = this.update.bind(this);
  }

  getCenter() {
    let coords = this.map.getCenter();
    this.x = coords.lat;
    this.y = coords.lng;
  }

  setDestination(x, y) {
    this.destinationX = x;
    this.destinationY = y;
  }

  update(z = undefined, zoomTime = undefined) {
    this.zoom = z || this.map.getZoom();

    // this.dx = (this.destinationX - this.x) * this.v;
    // this.dy = (this.destinationY - this.y) * this.v;
    // this.dz = (this.destinationZ - this.zoom) * 0.1;
    // this.zoom += this.dz;

    // if (this.dx ** 2 + this.dy ** 2 < 0.001) {
    //   this.x = this.destinationX;
    //   this.y = this.destinationY;
    //   return
    // }

    // this.x = this.x + this.dx;
    // this.y = this.y + this.dy;

    let offsetx = window.innerWidth < 700 ? 0 : 230;

    let targetPoint = this.map.project([this.destinationX, this.destinationY], this.zoom)
      .subtract([offsetx, 0]);
    let targetLatLng = this.map.unproject(targetPoint, this.zoom);

    if (zoomTime) {
      this.map.flyTo(targetLatLng, z, { duration: zoomTime });
    } else {
      this.map.setView(
        // [this.destinationX, this.destinationY],
        targetLatLng,
        this.zoom,
        { animate: true, duration: 1 },
      );
    }
  }

  // draw() {
  //   this.animationLoop = requestAnimationFrame(this.draw);
  //   let now = Date.now();
  //   let delta = now - this.then;
  //   let frameTime = 1000 / this.frameRate;
  //   if (delta > frameTime) {
  //     this.then = now - delta % frameTime;
  //     this.zoom = this.map.getZoom();
  //     this.dz = (this.destinationZ - this.zoom) * 0.2;
  //     this.zoom += this.dz;
  //     this.map.setView([this.destinationX, this.destinationY], this.zoom,
  //       { animate: true, duration: 1, });
  //   }
  // }
}

let camera = new Camera(map);
camera.setDestination(...mapCenter);
// camera.draw()

// =============
// getting data

let beap;
$.getJSON('data/trail-great.geojson', (data) => {
  // console.log(data.features);
  beap = data.features.filter((x) => x.properties['individual-local-identifier'] === 'XNC');
});

let windLayer;
$.getJSON('data/wind-global.json', (data) => {
  windLayer = L.velocityLayer({
    // displayValues: true,
    // displayOptions: {
    //   velocityType: 'Global Wind',
    //   position: 'bottomleft',
    //   emptyString: 'No wind data',
    // },
    data,
    // minVelocity: 10,
    // maxVelocity: 15,
    colorScale: ['rgba(255,255,255,100)'],
    velocityScale: 0.005,
    particleAge: 90,
    opacity: 0.1,
    particleMultiplier: 0.011,
  });
});

let coastData = [undefined, undefined, undefined];
$.getJSON('data/coast-1960.geojson', data => {
  coastData[0] = data;
});

$.getJSON('data/coast-2016.geojson', data => {
  coastData[1] = data;
});
$.getJSON('data/coast-poly.geojson', data => {
  coastData[2] = data;
});
// =======================================
// # section 2 #
sectionRenderer[1] = () => {
  if (!beap) {
    console.log('section 1 not ready!');
    return;
  }
  L.geoJSON(beap[0], {
    pointToLayer: (x, y) => L.circleMarker(y),
    style: { color: 'darkorange' },
  })
    .bindTooltip('Broome, Australia', { offset: [20, 0], direction: 'right' })
    .addTo(allLayers)
    .openTooltip();
};


// =======================================
// # section 3 #

sectionRenderer[2] = () => {
  if (!beap) return;
  let pts = beap.slice(0, 60).map(x => x.geometry.coordinates.slice().reverse());

  pts.forEach((pt) => {
    L.circleMarker(pt, {
      color: 'darkorange',
      radius: 4,
      weight: 2,
    }).addTo(allLayers);
  });

  L.polyline(pts, {
    color: 'darkorange',
    pane: 'traced',
    weight: 2,
  }).addTo(allLayers);

  windLayer.addTo(allLayers);
};

// =======================================
// # section 3 #

sectionRenderer[3] = () => {
  if (!beap) return;
  let pts = beap.slice(30, 60).map(x => x.geometry.coordinates.slice().reverse());
  let ptsPast = beap.slice(0, 31).map(x => x.geometry.coordinates.slice().reverse());

  L.polyline(ptsPast, {
    color: 'gray',
    weight: 2,
    opacity: 0.6,
  }).addTo(allLayers);

  pts.forEach((pt) => {
    L.circleMarker(pt, {
      color: 'darkorange',
      radius: 4,
      weight: 2,
    }).addTo(allLayers);
  });

  L.polyline(pts, {
    color: 'darkorange',
    pane: 'traced',
    weight: 2,
  }).addTo(allLayers);

  // ptsPast.forEach((ptPast) => {
  //   L.circleMarker(ptPast, {
  //     color: 'gray',
  //     radius: 3,
  //   }).addTo(allLayers);
  // });
};

sectionRenderer[4] = () => {
  if (!coastData.every(Boolean)) {
    setTimeout(sectionRenderer[4], 2000);
    return;
  }
  L.geoJSON(coastData[0], {
    color: '#05522d',
    pane: 'traced',
    weight: 2,
  }).addTo(allLayers)
    .bindTooltip('Coastline 1960s', {
      direction: 'left',
      className: 'coastline-pane coastline-1960',
    })
    .openTooltip([38.67, 117.37]);

  L.geoJSON(coastData[1], {
    color: '#ff4848',
    pane: 'traced',
    weight: 2,
  }).addTo(allLayers)
    .bindTooltip('Coastline 2016', {
      direction: 'right',
      className: 'coastline-pane coastline-2016',
    })
    .openTooltip([39.37, 119.38]);

  L.geoJSON(coastData[2], {
    color: 'darkorange',
    weight: 2,
    pane: 'poly',
  }).addTo(allLayers)
    .bindTooltip('Lost Habitat: 4063km<sup>2</sup>', {
      offset: [20, 0],
      direction: 'right',
      className: 'leaflet-poly-pane',
    })
    .openTooltip([38.9, 120]);
};




// =======================================
// # section 5 #

sectionRenderer[5] = () => {
  if (!beap) return;
  let endN = 100;
  let pts = beap.slice(endN, 150).map(x => x.geometry.coordinates.slice().reverse());
  let ptsPast = beap.slice(0, endN).map(x => x.geometry.coordinates.slice().reverse());

  // ptsPast.forEach((ptPast) => {
  //   L.circleMarker(ptPast, {
  //     color: 'gray',
  //     radius: 4,
  //   }).addTo(allLayers);
  // });

  L.polyline(ptsPast, {
    color: 'gray',
    weight: 2,
    opacity: 0.6,
  }).addTo(allLayers);

  pts.forEach((pt) => {
    L.circleMarker(pt, {
      color: 'darkorange',
      radius: 4,
      weight: 2,
    }).addTo(allLayers);
  });

  L.polyline(pts, {
    color: 'darkorange',
    pane: 'traced',
    weight: 2,
  }).addTo(allLayers);
};

sectionRenderer[6] = () => {
  if (!beap) return;
  let endN = 100;
  let pts = beap.slice(endN, 150).map(x => x.geometry.coordinates.slice().reverse());

  pts.forEach((pt) => {
    L.circleMarker(pt, {
      color: 'darkorange',
      radius: 3,
      weight: 1,
    }).addTo(allLayers);
  });
};


sectionRenderer[7] = () => {
  if (!beap) return;
  let endN = 0;
  let pts = beap.slice(endN, 150).map(x => x.geometry.coordinates.slice().reverse());

  L.polyline(pts, {
    color: 'darkorange',
    weight: 1,
    // opacity: 0.6,
  }).addTo(allLayers);
};

// L.canvasLayer()
//   .delegate(this)
//   .addTo(map);


// function onDrawLayer(info) {
//   let ctx = info.canvas.getContext('2d');
//   let data = beap.map((x) => [x.geometry.coordinates[1], x.geometry.coordinates[0]]);
//   ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);

//   for (let i = 0; i < data.length - 1; i++) {
//     let d1 = data[i];
//     let d2 = data[i + 1];
//     ctx.fillStyle = 'rgba(255,116,0)';

//     if (info.bounds.contains([d1[0], d1[1]])
//       || info.bounds.contains([d2[0], d2[1]])) {
//       dot1 = map.latLngToContainerPoint([d1[0], d1[1]]);
//       dot2 = map.latLngToContainerPoint([d2[0], d2[1]]);
//       let distance = ((dot1.y - dot2.y) ** 2 + (dot1.x - dot2.x) ** 2) ** 0.5;
//       let dpi = 5;
//       for (let j = 0; j < distance; j += dpi) {
//         let x = linearInsert(j, 0, distance, dot1.x, dot2.x);
//         let y = linearInsert(j, 0, distance, dot1.y, dot2.y);
//         ctx.beginPath();
//         ctx.arc(x, y, 3, 0, Math.PI * 2);
//         ctx.fill();
//         ctx.closePath();
//       }
//     }
//   }
// }
