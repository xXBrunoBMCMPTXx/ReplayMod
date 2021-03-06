package com.replaymod.recording.mixin;

import net.minecraft.entity.data.DataTracker;
import net.minecraft.client.network.packet.PlayerSpawnS2CPacket;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.gen.Accessor;

@Mixin(PlayerSpawnS2CPacket.class)
public interface SPacketSpawnPlayerAccessor {
    @Accessor("dataTracker")
    DataTracker getDataManager();
    @Accessor("dataTracker")
    void setDataManager(DataTracker value);
}
