<template>
  <div class="maptrack-warp">
    <slot></slot>
    <div
      class="maptrack-main"
      id="maptrack"
    ></div>
  </div>
</template>

<script>
  export default {
    name: 'QqmapTrack',
    props: {
      paths: {
        type: Array,
        default: () => [],
      },
      zoom: {
        type: Number,
        default: 13,
        validator: function (value) {
          return value >=1 && value <= 18
        }
      },
      hasZOOM: {
        type: Boolean,
        default: false
      },
      hasSCALE: {
        type: Boolean,
        default: false
      },
      hasROTATION: {
        type: Boolean,
        default: false
      },
      speed: {
        type: Number,
        default: 250
      },
      moveCar: {
        type: Boolean,
        default: true
      },
      mapKey: {
        type: String,
        default: '552BZ-RXYW4-PIIU4-XFZ3V-WQWLJ-7WBLE'
      },
      visibleMarker: {
        type: Boolean,
        default: true
      },
      icons: {
        type: Object,
        default: () => {
          return {
            'car': 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/car.png',
            'start': 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/start.png',
            'end': 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/end.png',
            'marker': 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png',
          }
        }
      }
    },
    computed: {
      LatLngArr() {
        return this.transformLatLng(this.paths)
      }
    },
    data() {
      return {
        isLoadQQMap: null, // 是否正常加载地图sdk
        mapInstance: null, // 地图实例
      }
    },
    watch: {
      paths: function() {
        this.initMap()
      }
    },
    async mounted() {
      try {
        if(!this.isLoadQQMap) {
          this.isLoadQQMap = await this.loadMap()
        }
        this.initMap()
      } catch(e) {
        console.log('map-track-error：', e)
        this.isLoadQQMap = null
      }
    },
    methods: {
      loadMap() {
        const that = this
        return new Promise(function(resolve, reject) {
          window.mapCallback = function() {
            resolve(window.qq);
          };
          var script = document.createElement("script");
          script.type = "text/javascript";
          script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${that.mapKey}&callback=mapCallback`;
          script.onerror = reject
          document.head.appendChild(script);
        });
      },
      transformLatLng() {
        if(this.paths.length === 0) return []
        return this.paths.map(item => {
          return new TMap.LatLng(item[0], item[1])
        })
      },
      initMap() {
        if(this.mapInstance) {
          this.mapInstance.destroy()
        }
        this.mapInstance = new TMap.Map("maptrack", {
          zoom: this.zoom,
        });

        if(!this.hasZOOM) {
          this.removeControl('ZOOM')
        }

        if(!this.hasSCALE) {
          this.removeControl('SCALE')
        }

        if(!this.hasROTATION) {
          this.removeControl('ROTATION')
        }

        if(this.paths.length) {
          this.drawPolylineLayer()
          this.drawMultiMarker()
          this.fitBounds()
        }
     
      },
      drawPolylineLayer() {
        new TMap.MultiPolyline({
          map: this.mapInstance, // 绘制到目标地图
          // 折线样式定义
          styles: {
            'style_blue': new TMap.PolylineStyle({
              'color': '#3777FF', //线填充色
              'width': 4, //折线宽度
              'borderWidth': 2, //边线宽度
              'borderColor': '#FFF', //边线颜色
              'lineCap': 'round' //线端头方式
            })
          },
          geometries: [{
            styleId: 'style_blue',
            paths: this.LatLngArr
          }],
        });
      },
      drawMultiMarker() {
        var marker = new TMap.MultiMarker({
          map: this.mapInstance,
          styles: {
            'car-down': new TMap.MarkerStyle({
              'width': 40,
              'height': 40,
              'anchor': {
                x: 20,
                y: 20,
              },
              'faceTo': 'map',
              'rotate': 180,
              'src': this.icons.car,
            }),
            "start": new TMap.MarkerStyle({
              "width": 25,
              "height": 35,
              "anchor": { x: 16, y: 32 },
              "src": this.icons.start
            }),
            "end": new TMap.MarkerStyle({
              "width": 25,
              "height": 35,
              "anchor": { x: 16, y: 32 },
              "src": this.icons.end
            }),
            "marker": new TMap.MarkerStyle({
              "width": 25,
              "height": 35,
              "anchor": { x: 16, y: 32 },
              "src": this.icons.marker
            })
          },
          geometries: [
            {
              id: 'car',
              styleId: 'car-down',
              position: this.LatLngArr[0],
            },
            {
              id: 'start',
              styleId: 'start',
              position: this.LatLngArr[0]
            },
            {
              id: 'end',
              styleId: 'end',
              position: this.LatLngArr[this.LatLngArr.length - 1]
            }
          ]
        });
        if(this.moveCar) {
          marker.moveAlong(
            {  
              'car': {
                path: this.LatLngArr,
                speed: this.speed
              }
            }, 
            {
              autoRotation: true
            }
          )
        }
        if( this.visibleMarker ) {
          const geometries = this.paths.reduce((all, item, index) => {
            let styleId = 'marker'
            if(index === 0) {
              styleId = 'start'
            }
            if(index === this.paths.length - 1) {
              styleId = 'end'
            }
            all.push( {
              id: 'end',
              styleId: styleId,
              position: new TMap.LatLng(item[0], item[1])
            })
            return all
          }, [])
          marker.updateGeometries(geometries)
        }
      },
      fitBounds() {
        var latlngBounds = new TMap.LatLngBounds();
        for(var i = 0;i<this.LatLngArr.length; i++){
          latlngBounds.extend(this.LatLngArr[i]);  
        }
        //调用fitBounds自动调整地图显示范围
        this.mapInstance.fitBounds(latlngBounds);
      },
      removeControl(type) {
         // 如果map上不存在该控件则直接返回
				if (!this.mapInstance.getControl(TMap.constants.DEFAULT_CONTROL_ID[type])) {
					return;
				}
				this.mapInstance.removeControl(TMap.constants.DEFAULT_CONTROL_ID[type]);
			}
    }
  }
</script>

<style lang="scss" scoped>
.maptrack {
  &-warp {
    position: relative;
    width: 100%;
    height: 100%;
  }
  &-main {
    width: 100%;
    height: 100%;
  }
}
</style>