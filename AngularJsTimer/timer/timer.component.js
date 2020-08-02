(function () {
    'use strict';

    angular.module('timer')

        .component('timer', {
            templateUrl: 'timer/timer.view.html',
        controller: "TimerController as vm"
        })

    .controller('TimerController', timerController);

    timerController.$inject = ['$timeout', '$rootScope'];

    function timerController($timeout, $rootScope) {
        // Public attributes
        var vm = this;
        vm.disablePauseResume = true;
        vm.isRunning = false;
        // Private attributes
        vm.state = 'Idle';
        vm.StartStop = 'Start';
        vm.PauseResume = 'Pause';
        vm.timeoutPromise = null;
        
        vm.runningConfig = {};

        // Init
        init();

        // Public Methods
        vm.startStop = startStop;
        vm.pauseResume = pauseResume;

        function startStop() {
            console.debug('startStop');

            if (vm.isRunning) {
              console.debug('Stopping...');
              stop();
            } else {
              console.debug('Starting...');
              start();
            }
        }

        function pauseResume() {
            console.debug('PauseResume');
            if (vm.isRunning) {
              pause();
            } else {
              resume();
            }
        }

        function init() {
            resetCounter();
            defaultSettings();
        }

        function defaultSettings() {
           
              vm.setting = {};

              vm.setting.prepare = 10;
              vm.setting.work = 20;
              vm.setting.rest = 10;
              vm.setting.cycles = 8;
              vm.setting.intervals = 1;

            vm.setting.timer = {hours:0,minutes:0,seconds:0};
        }

        function resetCounter() {
            console.debug('resetCounter');
            vm.runningConfig.timer = { hours: 0, minutes: 0, seconds: 0 };
            vm.runningConfig.overalltimer = { hours: 0, minutes: 0, seconds: 0 };
            vm.runningConfig.cycles = 0;
            vm.runningConfig.intervals = 0;
        }

        function start() {
            console.debug('Start');

            loadRunningConfig();
            
            if (vm.runningConfig.intervals > 0) {
                loadAllInterval();
                --vm.runningConfig.intervals;
              loadPrepare();
              vm.state = 'Prepare';
              vm.timeoutPromise = $timeout(decrementCounter, 1000);
              vm.isRunning = true;
              vm.StartStop = 'Stop';
              vm.disablePauseResume = false;
              vm.PauseResume = 'Pause';
            }
        }

        function resume() {
            console.debug('Resume');
            vm.isRunning = true;
            vm.StartStop = 'Stop';
            vm.disablePauseResume = false;
            vm.PauseResume = 'Pause';
            vm.timeoutPromise = $timeout(decrementCounter, 1000);
        }
        function loadRunningConfig() {
            vm.runningConfig = JSON.parse(JSON.stringify(vm.setting));
        }

        function loadAllInterval() {
            var allSec = vm.runningConfig.intervals *(vm.runningConfig.prepare + (vm.runningConfig.cycles * (vm.runningConfig.rest + vm.runningConfig.work)));
            var secNum = parseInt(allSec, 10);
            var hours = Math.floor(secNum / 3600);
            var minutes = Math.floor((secNum - (hours * 3600)) / 60);
            var seconds = secNum - (hours * 3600) - (minutes * 60);
            vm.runningConfig.overalltimer = { hours: hours, minutes: minutes, seconds: seconds};
        }

        function loadPrepare() {
            vm.runningConfig.timer = { hours: 0, minutes: 0, seconds: vm.runningConfig.prepare };
        }

        function loadWork() {
            vm.runningConfig.timer = {hours:0,minutes:0,seconds: vm.runningConfig.work};
        }

        function loadRest() {
            vm.runningConfig.timer = {hours:0,minutes:0,seconds: vm.runningConfig.rest};
        }

        function pause() {
            console.debug('Pause');

            $timeout.cancel(vm.timeoutPromise);
            vm.isRunning = false;

            vm.StartStop = 'Start';
            vm.PauseResume = 'Resume';
        }

        function stop() {
            console.debug('Stop');

            if (vm.isRunning) {
              $timeout.cancel(vm.timeoutPromise);
              vm.isRunning = false;
            }

            vm.StartStop = 'Start';
            vm.disablePauseResume = true;
            vm.PauseResume = 'Pause';
        }



        function decrementCounter() {
            console.debug('decrementCounter');

            if (vm.runningConfig.timer.seconds > 0) {
                vm.runningConfig.timer.seconds--;
            } else if (vm.runningConfig.timer.minutes > 0) {
                vm.runningConfig.timer.minutes--;
                vm.runningConfig.timer.seconds = decrement(vm.runningConfig.timer.seconds);
            } else if (vm.runningConfig.timer.hours > 0) {
                vm.runningConfig.timer.hours--;
                vm.runningConfig.timer.minutes = decrement(vm.runningConfig.timer.minutes);
                vm.runningConfig.timer.seconds = decrement(vm.runningConfig.timer.seconds);
            }

            if (vm.runningConfig.overalltimer.seconds > 0) {
                vm.runningConfig.overalltimer.seconds--;
            } else if (vm.runningConfig.overalltimer.minutes > 0) {
                vm.runningConfig.overalltimer.minutes--;
                vm.runningConfig.overalltimer.seconds = decrement(vm.runningConfig.overalltimer.seconds);
            } else if (vm.runningConfig.overalltimer.hours > 0) {
                vm.runningConfig.overalltimer.hours--;
                vm.runningConfig.overalltimer.minutes = decrement(vm.runningConfig.overalltimer.minutes);
                vm.runningConfig.overalltimer.seconds = decrement(vm.runningConfig.overalltimer.seconds);
            }

            if (countIsNotZero(vm.runningConfig.timer.hours, vm.runningConfig.timer.minutes, vm.runningConfig.timer.seconds)) {
                vm.timeoutPromise = $timeout(decrementCounter, 1000);
            } else if (vm.state === 'Prepare') {
                if (vm.runningConfig.cycles > 0)--vm.runningConfig.cycles;
                loadWork();
                vm.state = 'Work';
                vm.timeoutPromise = $timeout(decrementCounter, 1000);
            } else if (vm.state === 'Work') {
                loadRest();
                vm.state = 'Rest';
                vm.timeoutPromise = $timeout(decrementCounter, 1000);
            } else if (vm.state === 'Rest') {
                if (vm.runningConfig.cycles !== 0) {
                    --vm.runningConfig.cycles;
                    loadWork();
                    vm.state = 'Work';
                    vm.timeoutPromise = $timeout(decrementCounter, 1000);
                } else if (vm.runningConfig.intervals !== 0) {
                    vm.runningConfig.cycles = vm.setting.cycles;
                    --vm.runningConfig.intervals;
                    loadPrepare();
                    vm.state = 'Prepare';
                    vm.timeoutPromise = $timeout(decrementCounter, 1000);
                } else {
                    vm.state = 'Idle';
                    stop();
                }
            }
        }
        //Helper functions

        function decrement(number) {
            var ret = number;
            if (number > 0) ret = --number;
            else ret = 59;
            return ret;
        }

        function countIsNotZero(hours, minutes, seconds) {
            return !(hours === 0 && minutes === 0 && seconds === 0);
        }




    }

})();